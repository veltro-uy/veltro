<?php

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->beforeEach(function () {
        $this->withoutVite();
    })
    ->in('Feature');
