import { CalendarDays, ChefHat, Plus } from 'lucide-react';
import { Button } from '@/shared/components/Button';

export function Planning() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-forest">Planning</h1>
          <p className="text-sm text-forest/50 mt-0.5">Plan meals and reduce food waste</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1.5" />
          New Meal Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-forest/10">
            <CalendarDays className="h-5 w-5 text-forest" />
          </div>
          <div>
            <h3 className="text-base font-medium text-forest">Upcoming Meal Plans</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Schedule meals using your current inventory
            </p>
          </div>
          <div className="mt-2 h-32 rounded-md bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No meal plans yet</span>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber/10">
            <ChefHat className="h-5 w-5 text-amber" />
          </div>
          <div>
            <h3 className="text-base font-medium text-forest">Use Before Expiry</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Items that should be planned into meals soon
            </p>
          </div>
          <div className="mt-2 h-32 rounded-md bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
