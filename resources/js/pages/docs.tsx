import AppLogoIcon from '@/components/app-logo-icon';
import { UseCaseTable } from '@/components/docs/use-case-table';
import LandingFooter from '@/components/landing-footer';
import { Button } from '@/components/ui/button';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    testSuites,
    type TestCaseStatus,
    type UseCaseSuite,
} from '@/data/test-cases';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { home } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'veltro:docs:test-status';

type StatusMap = Record<string, TestCaseStatus>;

// Stable reference so the hook's memoized value doesn't churn every render.
const EMPTY_STATUS: StatusMap = {};

interface Category {
    name: string;
    suites: UseCaseSuite[];
}

// Group suites by category, preserving their declaration order.
const categories: Category[] = testSuites.reduce<Category[]>((acc, suite) => {
    const existing = acc.find((c) => c.name === suite.category);
    if (existing) {
        existing.suites.push(suite);
    } else {
        acc.push({ name: suite.category, suites: [suite] });
    }
    return acc;
}, []);

const tabListClasses = 'h-auto w-full flex-wrap sm:h-8 sm:w-fit';

export default function Docs() {
    const [statuses, setStatuses] = useLocalStorage<StatusMap>(
        STORAGE_KEY,
        EMPTY_STATUS,
    );

    const handleStatusChange = (id: string, status: TestCaseStatus) => {
        setStatuses((prev) => ({ ...prev, [id]: status }));
    };

    const resetStatuses = () => setStatuses({});

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title="Documentación" />

            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-[104rem] items-center justify-between px-4 md:px-6">
                    <Link
                        href={home().url}
                        className="flex items-center gap-2.5"
                    >
                        <AppLogoIcon className="size-7 text-primary" />
                        <span className="text-display text-xl tracking-wide text-foreground">
                            Veltro
                        </span>
                    </Link>

                    <Button
                        size="sm"
                        variant="outline"
                        className="h-9"
                        onClick={resetStatuses}
                    >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Reiniciar estados
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-[104rem] px-4 py-8 md:px-6 md:py-10">
                <div className="mb-8">
                    <h1 className="text-display text-3xl tracking-wide">
                        Casos de uso
                    </h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        Casos de prueba de la plataforma. Marcá el estado de cada
                        caso mientras lo verificás; los estados se guardan en
                        este navegador.
                    </p>
                </div>

                <Tabs
                    defaultValue={categories[0].name}
                    className="w-full gap-4"
                >
                    <TabsList variant="line" className={tabListClasses}>
                        {categories.map((category) => (
                            <TabsTrigger
                                key={category.name}
                                value={category.name}
                                className="flex-none"
                            >
                                {category.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {categories.map((category) => (
                        <TabsContent
                            key={category.name}
                            value={category.name}
                            className="space-y-4"
                        >
                            <Tabs
                                defaultValue={category.suites[0].key}
                                className="w-full"
                            >
                                <TabsList className={tabListClasses}>
                                    {category.suites.map((suite) => (
                                        <TabsTrigger
                                            key={suite.key}
                                            value={suite.key}
                                            className="flex-none"
                                        >
                                            {suite.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {category.suites.map((suite) => (
                                    <TabsContent
                                        key={suite.key}
                                        value={suite.key}
                                        className="space-y-4"
                                    >
                                        <p className="text-sm text-muted-foreground">
                                            {suite.description}
                                        </p>
                                        <UseCaseTable
                                            label={suite.label}
                                            cases={suite.cases}
                                            statuses={statuses}
                                            onStatusChange={handleStatusChange}
                                        />
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </TabsContent>
                    ))}
                </Tabs>
            </main>

            <LandingFooter />
        </div>
    );
}
