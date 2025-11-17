import { useNavigate } from 'react-router-dom';
import { Button } from '@components/Common/UI/Button';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#1a2327] to-[#1a2327]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-white/70 mb-8">
          You don&#39;t have permission to access this page.
        </p>
        <Button
          onClick={() => navigate('/', { replace: true })}
          className="bg-[#f3684e] hover:bg-[#f3684e]/90 text-white px-6 py-2 rounded-xl"
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
}