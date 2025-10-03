import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import HTTPException
from src.dependencies import get_current_session


class TestGetCurrentSession:
    """Test authentication dependency"""

    @pytest.mark.asyncio
    @patch('src.dependencies.httpx.AsyncClient')
    async def test_valid_session(self, mock_client_class):
        """Test successful session validation"""
        # Mock the HTTP client
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "user": {"id": "user123", "email": "test@example.com"}
        }
        mock_client.get.return_value = mock_response
        mock_client_class.return_value.__aenter__.return_value = mock_client

        # Mock request with valid cookie
        mock_request = MagicMock()
        mock_request.cookies = {"better-auth.session_token": "valid-token"}

        result = await get_current_session(mock_request)

        assert result == {
            "user": {"id": "user123", "email": "test@example.com"}
        }
        mock_client.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_missing_session_token(self):
        """Test missing session token"""
        mock_request = MagicMock()
        mock_request.cookies = {}

        with pytest.raises(HTTPException) as exc_info:
            await get_current_session(mock_request)

        assert exc_info.value.status_code == 401
        assert "Not authenticated" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch('src.dependencies.httpx.AsyncClient')
    async def test_invalid_session_response(self, mock_client_class):
        """Test invalid session response from auth service"""
        # Mock failed HTTP response
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_client.get.return_value = mock_response
        mock_client_class.return_value.__aenter__.return_value = mock_client

        mock_request = MagicMock()
        mock_request.cookies = {"better-auth.session_token": "invalid-token"}

        with pytest.raises(HTTPException) as exc_info:
            await get_current_session(mock_request)

        assert exc_info.value.status_code == 401
        assert "Invalid session token" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch('src.dependencies.httpx.AsyncClient')
    async def test_malformed_session_response(self, mock_client_class):
        """Test malformed session response"""
        # Mock response without user field
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"no-user": True}
        mock_client.get.return_value = mock_response
        mock_client_class.return_value.__aenter__.return_value = mock_client

        mock_request = MagicMock()
        mock_request.cookies = {"better-auth.session_token": "token"}

        with pytest.raises(HTTPException) as exc_info:
            await get_current_session(mock_request)

        assert exc_info.value.status_code == 401
        assert "Session not found or invalid" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch('src.dependencies.httpx.AsyncClient')
    async def test_network_error(self, mock_client_class):
        """Test network error during auth check"""
        # Mock network exception
        mock_client = AsyncMock()
        mock_client.get.side_effect = Exception("Network error")
        mock_client_class.return_value.__aenter__.return_value = mock_client

        mock_request = MagicMock()
        mock_request.cookies = {"better-auth.session_token": "token"}

        with pytest.raises(Exception):
            await get_current_session(mock_request)