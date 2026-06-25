@props(['url'])
<tr>
<td class="header" bgcolor="#101312" style="background-color: #101312;">
<a href="{{ $url }}" style="display: inline-block; text-decoration: none;">
<img src="{{ rtrim(config('app.url'), '/') }}/icon-192.png" width="50" height="50" alt="Veltro" style="display: inline-block; vertical-align: middle; height: 50px; width: 50px; border: 0; line-height: 50px;">
<span style="display: inline-block; vertical-align: middle; margin-left: 12px; color: #f4f7f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 800; letter-spacing: 5px; text-transform: uppercase;">Veltro</span>
</a>
</td>
</tr>
