<?php

declare(strict_types=1);

namespace App\Models\Concerns;

/**
 * Gives a model a short, opaque, non-sequential public identifier used in URLs
 * instead of the auto-increment primary key. This removes ID enumeration as an
 * attack/scraping surface and keeps internal foreign keys unchanged.
 *
 * The token is a 12-character base62 string (~71 bits of entropy). A unique
 * index on `public_id` plus regeneration-on-conflict guarantees uniqueness.
 */
trait HasPublicId
{
    /**
     * Characters used to build the public id. Base62 is URL-safe and has no
     * ambiguous separators, so the whole token is a single path segment.
     */
    private const PUBLIC_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    private const PUBLIC_ID_LENGTH = 12;

    protected static function bootHasPublicId(): void
    {
        static::creating(function ($model): void {
            if (empty($model->public_id)) {
                $model->public_id = $model->generateUniquePublicId();
            }
        });
    }

    /**
     * Resolve route-model binding by the public id instead of the primary key.
     */
    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    /**
     * Generate a public id that is not already used by another row.
     */
    public function generateUniquePublicId(): string
    {
        do {
            $candidate = static::makePublicId();
        } while (static::query()->where('public_id', $candidate)->exists());

        return $candidate;
    }

    /**
     * Build a random base62 token of the configured length.
     */
    public static function makePublicId(): string
    {
        $alphabet = self::PUBLIC_ID_ALPHABET;
        $max = strlen($alphabet) - 1;

        $token = '';
        for ($i = 0; $i < self::PUBLIC_ID_LENGTH; $i++) {
            $token .= $alphabet[random_int(0, $max)];
        }

        return $token;
    }
}
