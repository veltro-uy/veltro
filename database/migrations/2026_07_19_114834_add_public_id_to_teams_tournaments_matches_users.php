<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds an opaque, non-sequential `public_id` to the resources that appear in
 * address-bar URLs (teams, tournaments, matches, users) so those URLs no longer
 * expose enumerable auto-increment primary keys.
 *
 * Three steps per table: add the column nullable, backfill existing rows with
 * unique tokens, then enforce NOT NULL + a unique index.
 */
return new class extends Migration
{
    /**
     * Tables that receive a public id.
     *
     * @var array<int, string>
     */
    private array $tables = ['teams', 'tournaments', 'matches', 'users'];

    private const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    private const LENGTH = 12;

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->string('public_id', 12)->nullable()->after('id');
            });

            $this->backfill($table);

            Schema::table($table, function (Blueprint $blueprint) use ($table): void {
                $blueprint->string('public_id', 12)->nullable(false)->change();
                $blueprint->unique('public_id', "{$table}_public_id_unique");
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table): void {
                $blueprint->dropUnique("{$table}_public_id_unique");
                $blueprint->dropColumn('public_id');
            });
        }
    }

    /**
     * Assign a unique token to every existing row.
     */
    private function backfill(string $table): void
    {
        $used = [];

        DB::table($table)->orderBy('id')->select('id')->chunkById(500, function ($rows) use ($table, &$used): void {
            foreach ($rows as $row) {
                do {
                    $token = $this->makeToken();
                } while (isset($used[$token]));

                $used[$token] = true;

                DB::table($table)->where('id', $row->id)->update(['public_id' => $token]);
            }
        });
    }

    private function makeToken(): string
    {
        $max = strlen(self::ALPHABET) - 1;
        $token = '';

        for ($i = 0; $i < self::LENGTH; $i++) {
            $token .= self::ALPHABET[random_int(0, $max)];
        }

        return $token;
    }
};
