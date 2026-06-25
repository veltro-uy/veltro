<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rejects text that looks like code or an injection attempt.
 *
 * Purely cosmetic / UX: inputs are already safe against SQL injection via
 * Eloquent's parameterized queries. This rule keeps strings like
 * `' OR '1'='1` or `' AND 1=CONVERT(int,'a') --` out of identifier-style
 * fields (team/tournament names, locations) where they would just look bad.
 *
 * It is permissive toward normal text (accents, emoji, single apostrophes,
 * single dashes); it only flags the structural signatures of code/injection.
 */
class CleanText implements ValidationRule
{
    /**
     * Patterns whose presence marks the value as code-like.
     *
     * @var array<int, string>
     */
    private const SIGNATURES = [
        // SQL comment / statement-terminator sequences.
        '/--/',
        '/;/',
        '/\/\*|\*\//',
        '/#/',
        // Angle brackets / HTML & script tags.
        '/[<>]/',
        // Comparison operator.
        '/=/',
        // Quote paired with a boolean operator or comparison (classic injection shape).
        '/[\'"`].*(\bor\b|\band\b|=)/i',
        // Function-call shape used in payloads, e.g. CONVERT(, CHAR(, CAST(.
        '/\b(convert|cast|char|concat|exec|select|union|declare)\s*\(/i',
    ];

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        foreach (self::SIGNATURES as $pattern) {
            if (preg_match($pattern, $value) === 1) {
                $fail('El texto contiene caracteres o palabras no permitidos.');

                return;
            }
        }
    }
}
