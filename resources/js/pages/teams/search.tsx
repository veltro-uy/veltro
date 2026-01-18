import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { VariantBadge } from '@/components/variant-badge';
import AppLayout from '@/layouts/app-layout';
import teams from '@/routes/teams';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Search as SearchIcon, Users } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Teams',
        href: teams.index().url,
    },
    {
        title: 'Search',
        href: teams.search().url,
    },
];

interface TeamMember {
    id: number;
    user_id: number;
    team_id: number;
    role: string;
    status: string;
}

interface Team {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
    description?: string;
    team_members: TeamMember[];
}

interface Props {
    teams: Team[];
    filters?: {
        name?: string;
        variant?: string;
    };
}

export default function SearchTeams({ teams: searchResults, filters }: Props) {
    const [name, setName] = useState(filters?.name || '');
    const [variant, setVariant] = useState(filters?.variant || '');

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            teams.search().url,
            {
                name,
                variant,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Search Teams" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Search Teams
                    </h1>
                    <p className="text-muted-foreground">Find and join teams</p>
                </div>

                {/* Search Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search Filters</CardTitle>
                        <CardDescription>
                            Refine your search to find the perfect team
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Team Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="Search by name..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="variant">Variant</Label>
                                    <Select
                                        value={variant}
                                        onValueChange={setVariant}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All variants" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">
                                                All variants
                                            </SelectItem>
                                            <SelectItem value="football_11">
                                                Football 11
                                            </SelectItem>
                                            <SelectItem value="football_7">
                                                Football 7
                                            </SelectItem>
                                            <SelectItem value="football_5">
                                                Football 5
                                            </SelectItem>
                                            <SelectItem value="futsal">
                                                Futsal
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit">
                                <SearchIcon className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Results */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold">
                        Search Results{' '}
                        {searchResults && `(${searchResults.length})`}
                    </h2>

                    {searchResults && searchResults.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-12">
                            <CardContent className="flex flex-col items-center gap-4 pt-6">
                                <div className="rounded-full bg-muted p-4">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold">
                                        No teams found
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Try adjusting your search filters
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {searchResults?.map((team) => (
                                <Card
                                    key={team.id}
                                    className="group transition-all hover:border-primary/20 hover:shadow-lg"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start gap-3">
                                            <TeamAvatar
                                                name={team.name}
                                                logoUrl={team.logo_url}
                                                size="lg"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="line-clamp-1 text-lg">
                                                    {team.name}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    <VariantBadge
                                                        variant={team.variant}
                                                    />
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {team.description && (
                                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                                {team.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    Members
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold">
                                                {team.team_members.length}
                                            </span>
                                        </div>

                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                                        >
                                            <Link
                                                href={teams.show(team.id).url}
                                            >
                                                View Team
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
