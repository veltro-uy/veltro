<?php

it('carga la pagina de inicio correctamente', function () {
    $this->get('/')
        ->assertOk();
});
