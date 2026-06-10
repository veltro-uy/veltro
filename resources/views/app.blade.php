<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Keep the application on the fixed dark Veltro theme before React hydrates. --}}
    <script>
        (function() {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html,
        html.dark {
            background-color: #101312;
        }
    </style>

    <title inertia>{{ config('app.name', 'Veltro') }}</title>

    {{-- Icons --}}
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <meta name="theme-color" content="#101312">

    {{-- SEO / social sharing --}}
    @php
        $seoName = config('app.name', 'Veltro');
        $seoDescription = 'Gestioná tu equipo de fútbol amateur: organizá partidos, seguí la asistencia, las estadísticas y los torneos en una sola app. Hecho en Uruguay para fútbol 11, 7, 5 y futsal.';
        $seoImage = url('/og-image.png');
        $seoUrl = url()->current();
    @endphp
    <meta name="description" content="{{ $seoDescription }}">
    <link rel="canonical" href="{{ $seoUrl }}">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ $seoName }}">
    <meta property="og:title" content="{{ $seoName }}">
    <meta property="og:description" content="{{ $seoDescription }}">
    <meta property="og:url" content="{{ $seoUrl }}">
    <meta property="og:image" content="{{ $seoImage }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="{{ $seoName }}">
    <meta property="og:locale" content="es_UY">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $seoName }}">
    <meta name="twitter:description" content="{{ $seoDescription }}">
    <meta name="twitter:image" content="{{ $seoImage }}">

    <link rel="preload" href="/fonts/barlow-condensed-700-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/barlow-condensed-800-latin.woff2" as="font" type="font/woff2" crossorigin>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
