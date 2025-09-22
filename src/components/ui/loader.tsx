
import { Loader2 } from 'lucide-react';

const Loader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin">
      <Loader2 className="h-12 w-12 text-primary" />
    </div>
  </div>
);

export default Loader;