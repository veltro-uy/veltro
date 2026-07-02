import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { TestCase, TestCaseStatus } from '@/data/test-cases';

const STATUS_LABELS: Record<TestCaseStatus, string> = {
    pending: 'Pendiente',
    pass: 'Pasa',
    fail: 'Falla',
};

const STATUS_ORDER: TestCaseStatus[] = ['pending', 'pass', 'fail'];

const STATUS_DOT: Record<TestCaseStatus, string> = {
    pending: 'bg-muted-foreground',
    pass: 'bg-emerald-500',
    fail: 'bg-destructive',
};

const STATUS_TEXT: Record<TestCaseStatus, string> = {
    pending: 'text-foreground',
    pass: 'text-emerald-600 dark:text-emerald-400',
    fail: 'text-destructive',
};

function StatusLabel({ status }: { status: TestCaseStatus }) {
    return (
        <span className="flex min-w-0 flex-1 items-center gap-2">
            <span
                className={cn('size-2 shrink-0 rounded-full', STATUS_DOT[status])}
            />
            <span className={cn('truncate', STATUS_TEXT[status])}>
                {STATUS_LABELS[status]}
            </span>
        </span>
    );
}

interface StatusSelectProps {
    id: string;
    status: TestCaseStatus;
    onStatusChange: (id: string, status: TestCaseStatus) => void;
    className?: string;
}

function StatusSelect({
    id,
    status,
    onStatusChange,
    className,
}: StatusSelectProps) {
    return (
        <Select
            value={status}
            onValueChange={(value) =>
                onStatusChange(id, value as TestCaseStatus)
            }
        >
            <SelectTrigger
                aria-label={`Estado de ${id}`}
                className={cn('h-8 min-w-0', className)}
            >
                <StatusLabel status={status} />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
                {STATUS_ORDER.map((option) => (
                    <SelectItem key={option} value={option}>
                        <StatusLabel status={option} />
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

/** Bulleted "Datos de prueba" list, shared by table and card. */
function TestDataList({ items }: { items: string[] }) {
    return (
        <ul className="list-disc space-y-1 pl-4 leading-relaxed break-words marker:text-muted-foreground">
            {items.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ul>
    );
}

/** Numbered "Pasos" list, shared by table and card. */
function StepList({ steps }: { steps: string[] }) {
    return (
        <ol className="list-decimal space-y-1 pl-4 leading-relaxed break-words marker:text-muted-foreground">
            {steps.map((step, i) => (
                <li key={i}>{step}</li>
            ))}
        </ol>
    );
}

interface UseCaseCardProps {
    testCase: TestCase;
    status: TestCaseStatus;
    onStatusChange: (id: string, status: TestCaseStatus) => void;
}

function UseCaseCard({ testCase, status, onStatusChange }: UseCaseCardProps) {
    return (
        <Card size="sm">
            <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">
                            {testCase.id} · {testCase.requirement}
                        </p>
                        <p className="mt-0.5 font-medium break-words">
                            {testCase.title}
                        </p>
                    </div>
                    <StatusSelect
                        id={testCase.id}
                        status={status}
                        onStatusChange={onStatusChange}
                        className="w-32 shrink-0"
                    />
                </div>

                <dl className="grid gap-3 sm:grid-cols-2 sm:gap-x-6">
                    <div className="min-w-0">
                        <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                            Precondiciones
                        </dt>
                        <dd className="mt-1 break-words">
                            {testCase.preconditions}
                        </dd>
                    </div>
                    <div className="min-w-0">
                        <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                            Datos de prueba
                        </dt>
                        <dd className="mt-1">
                            <TestDataList items={testCase.testData} />
                        </dd>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                        <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                            Pasos
                        </dt>
                        <dd className="mt-1">
                            <StepList steps={testCase.steps} />
                        </dd>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                        <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                            Resultado esperado
                        </dt>
                        <dd className="mt-1 break-words">
                            {testCase.expectedResult}
                        </dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}

interface UseCaseTableProps {
    /** Human-readable suite name, used in the accessible table caption. */
    label: string;
    cases: TestCase[];
    statuses: Record<string, TestCaseStatus>;
    onStatusChange: (id: string, status: TestCaseStatus) => void;
}

export function UseCaseTable({
    label,
    cases,
    statuses,
    onStatusChange,
}: UseCaseTableProps) {
    const counts = cases.reduce(
        (acc, testCase) => {
            const status = statuses[testCase.id] ?? 'pending';
            acc[status] += 1;
            return acc;
        },
        { pending: 0, pass: 0, fail: 0 } as Record<TestCaseStatus, number>,
    );

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">
                    {counts.pass} pasan
                </span>
                <span className="text-destructive">{counts.fail} fallan</span>
                <span className="text-muted-foreground">
                    {counts.pending} pendientes
                </span>
            </div>

            {/* Desktop / large screens: full table */}
            <div className="hidden overflow-hidden rounded-xl ring-1 ring-foreground/10 lg:block">
                <Table className="table-fixed">
                    <caption className="sr-only">
                        Casos de prueba de {label}
                    </caption>
                    <colgroup>
                        <col className="w-[8.5rem]" />
                        <col className="w-[7.5rem]" />
                        <col className="w-[10rem]" />
                        <col className="w-[8.5rem]" />
                        <col />
                        <col />
                        <col />
                        <col className="w-[9.5rem]" />
                    </colgroup>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="text-xs tracking-wide uppercase">
                                ID
                            </TableHead>
                            <TableHead className="text-xs tracking-wide uppercase">
                                Requerimiento
                            </TableHead>
                            <TableHead className="text-xs tracking-wide uppercase">
                                Título
                            </TableHead>
                            <TableHead className="text-xs tracking-wide uppercase">
                                Precondiciones
                            </TableHead>
                            <TableHead className="text-xs tracking-wide uppercase">
                                Datos de prueba
                            </TableHead>
                            <TableHead className="text-xs tracking-wide uppercase">
                                Pasos
                            </TableHead>
                            <TableHead className="text-xs tracking-wide uppercase">
                                Resultado esperado
                            </TableHead>
                            <TableHead className="text-xs tracking-wide uppercase">
                                Estado
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cases.map((testCase) => {
                            const status = statuses[testCase.id] ?? 'pending';

                            return (
                                <TableRow
                                    key={testCase.id}
                                    className="even:bg-muted/20"
                                >
                                    <TableCell className="font-mono text-xs whitespace-nowrap">
                                        {testCase.id}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs break-words text-muted-foreground">
                                        {testCase.requirement}
                                    </TableCell>
                                    <TableCell className="font-medium break-words">
                                        {testCase.title}
                                    </TableCell>
                                    <TableCell className="break-words text-muted-foreground">
                                        {testCase.preconditions}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <TestDataList
                                            items={testCase.testData}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <StepList steps={testCase.steps} />
                                    </TableCell>
                                    <TableCell className="break-words text-muted-foreground">
                                        {testCase.expectedResult}
                                    </TableCell>
                                    <TableCell>
                                        <StatusSelect
                                            id={testCase.id}
                                            status={status}
                                            onStatusChange={onStatusChange}
                                            className="w-full"
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Phones + tablets: stacked cards */}
            <div className="space-y-3 lg:hidden">
                {cases.map((testCase) => (
                    <UseCaseCard
                        key={testCase.id}
                        testCase={testCase}
                        status={statuses[testCase.id] ?? 'pending'}
                        onStatusChange={onStatusChange}
                    />
                ))}
            </div>
        </div>
    );
}
