import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Calendar, 
  Users, 
  Bell, 
  Sparkles, 
  ArrowRight,
  GraduationCap,
  Stethoscope,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Calendar,
    title: 'Unified Family Calendar',
    description: 'One calendar for school, health, activities, and personal events. Color-coded by category and child.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Scheduling',
    description: 'Create events from emails, photos, or voice. Our AI extracts dates, times, and details automatically.',
  },
  {
    icon: Users,
    title: 'Child Profiles',
    description: 'Track each child\'s schedule, activities, and appointments. See everything at a glance.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Get notified before appointments with travel-time alerts. Never miss an important event.',
  },
];

const categories = [
  { icon: GraduationCap, label: 'School', color: 'bg-[hsl(199,89%,94%)] text-[hsl(199,60%,32%)] border-[hsl(199,89%,80%)]' },
  { icon: Stethoscope, label: 'Health', color: 'bg-[hsl(142,60%,92%)] text-[hsl(142,50%,28%)] border-[hsl(142,50%,75%)]' },
  { icon: Trophy, label: 'Activities', color: 'bg-[hsl(280,50%,94%)] text-[hsl(280,45%,35%)] border-[hsl(280,40%,80%)]' },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Heart className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">Kinly.ai</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-secondary/50 blur-3xl" />
        </div>
        
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-powered family scheduling
            </div>
            
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Keep your whole family{' '}
              <span className="bg-gradient-to-r from-primary to-[hsl(25,80%,55%)] bg-clip-text text-transparent">
                in sync
              </span>
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              One place to manage school schedules, health appointments, extracurriculars, and more. 
              Never miss a parent-teacher conference or soccer practice again.
            </p>
            
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/register">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link to="/login">See how it works</Link>
              </Button>
            </div>
            
            {/* Category pills */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.label}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
                    cat.color
                  )}
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Everything your busy family needs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Simplify your family's schedule with powerful features designed for modern parents.
            </p>
          </div>
          
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-soft hover:border-primary/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-secondary/10 p-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Ready to get organized?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of families who trust Kinly.ai to keep their schedules in order.
            </p>
            <div className="mt-8">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/register">
                  Start your free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
