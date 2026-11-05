import { lazy, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SiteLayout } from '@/components/site/layout';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

// Code-split secondary routes.
const CarsPage = lazy(() => import('@/pages/cars'));
const CarDetail = lazy(() => import('@/pages/car-detail'));
const About = lazy(() => import('@/pages/about'));
const Contact = lazy(() => import('@/pages/contact'));
const Admin = lazy(() => import('@/pages/admin'));

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });

function PageFallback() {
  return <div className="mx-auto max-w-[1400px] px-5 pt-36 md:px-10"><div className="h-16 w-2/3 animate-pulse bg-muted" /><div className="mt-6 h-64 animate-pulse bg-muted" /></div>;
}

function Router() {
  return (
    <SiteLayout>
      <RoutedErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/cars" component={CarsPage} />
            <Route path="/inventory"><Redirect to="/cars" replace /></Route>
            <Route path="/cars/:slug" component={CarDetail} />
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </RoutedErrorBoundary>
    </SiteLayout>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
