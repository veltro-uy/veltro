<?php

it('mantiene la identidad del proyecto en composer', function () {
    $composer = json_decode(
        file_get_contents(dirname(__DIR__, 2).'/composer.json'),
        true,
        flags: JSON_THROW_ON_ERROR
    );

    expect($composer['name'])->toBe('veltro-uy/veltro')
        ->and($composer['description'])->toContain('fútbol amateur');
});
