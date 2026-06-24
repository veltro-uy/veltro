<?php

use App\Rules\CleanText;

function cleanTextFails(string $value): bool
{
    $failed = false;

    (new CleanText)->validate('field', $value, function () use (&$failed) {
        $failed = true;
    });

    return $failed;
}

test('rejects injection-looking strings', function (string $value) {
    expect(cleanTextFails($value))->toBeTrue();
})->with([
    "' OR '1'='1",
    "' AND 1=CONVERT(int,'a') --",
    '; DROP TABLE teams',
    '<script>alert(1)</script>',
    'SELECT(*) FROM users',
    'a=b',
    'foo; delete from users',
]);

test('accepts normal identifier text', function (string $value) {
    expect(cleanTextFails($value))->toBeFalse();
})->with([
    'Los Tigres',
    'Peñarol FC',
    'Cancha 5 - Parque Rodó',
    "O'Higgins",
    'Fútbol 5',
    'Defensor 🦊',
    'Co-Captain Update',
    'Select FC',
]);
