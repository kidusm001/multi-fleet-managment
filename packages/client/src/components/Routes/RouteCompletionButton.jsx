import { useState } from 'react';
import PropTypes from 'prop-types';
import { Check, CheckCircle } from 'lucide-react';
import Button from '@/components/Common/UI/Button';
import { toast } from 'sonner';
import { routeCompletionService } from '@/services/routeCompletionService';

/**
 * RouteCompletionButton
 * Simple button to mark a route as completed
 * 
 * @param {Object} props
 * @param {string} props.routeId - ID of the route to complete
 * @param {Function} props.onComplete - Callback fired after successful completion
 * @param {string} props.variant - Button variant (default: 'success')
 * @param {string} props.size - Button size (default: 'md')
 * @param {boolean} props.showIcon - Whether to show the check icon (default: true)
 * @param {string} props.label - Button label (default: 'Complete Route')
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.className - Additional CSS classes
 */
const RouteCompletionButton = ({
  routeId,
  onComplete,
  variant = 'success',
  size = 'md',
  showIcon = true,
  label = 'Complete Route',
  disabled = false,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleComplete = async () => {
    if (!routeId) {
      toast.error('No route ID provided');
      return;
    }

    setLoading(true);
    try {
      const result = await routeCompletionService.completeRoute(routeId);
      
      setCompleted(true);
      toast.success(result.message || 'Route completed successfully!', {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      });

      // Call the callback if provided
      if (onComplete) {
        onComplete(result.completion);
      }

      // Reset completed state after 2 seconds for visual feedback
      setTimeout(() => {
        setCompleted(false);
      }, 2000);

    } catch (error) {
      console.error('Error completing route:', error);
      toast.error(error.message || 'Failed to complete route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleComplete}
      loading={loading}
      disabled={disabled || completed}
      variant={completed ? 'outline' : variant}
      size={size}
      className={className}
      icon={showIcon ? <Check className="h-4 w-4" /> : null}
    >
      {completed ? 'Completed!' : label}
    </Button>
  );
};

RouteCompletionButton.propTypes = {
  routeId: PropTypes.string.isRequired,
  onComplete: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: PropTypes.bool,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default RouteCompletionButton;
