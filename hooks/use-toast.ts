// Simple toast hook for now
// TODO: Implement full toast system with Sonner or similar

export function useToast() {
  return {
    toast: ({ title, description, variant }: {
      title: string;
      description?: string;
      variant?: 'default' | 'destructive';
    }) => {
      // Simple console log for now
      console.log(`[Toast ${variant || 'default'}]`, title, description);

      // TODO: Replace with actual toast implementation
      alert(`${title}${description ? '\n' + description : ''}`);
    }
  };
}
