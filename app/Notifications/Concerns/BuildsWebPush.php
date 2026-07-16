<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

use NotificationChannels\WebPush\WebPushMessage;

/**
 * Builds a Web Push payload from a notification's existing `toDatabase()` array.
 *
 * Every notification in this app returns a consistent shape from `toDatabase()`
 * (`title`, `message`, `action_url`, `icon`, `type`), so the push message can be
 * derived from it without duplicating copy. Notifications using this trait must
 * add `WebPushChannel::class` to their `via()` array.
 */
trait BuildsWebPush
{
    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        $data = $this->toDatabase($notifiable);

        return (new WebPushMessage)
            ->title($data['title'])
            ->body($data['message'])
            ->icon('/icon-192.png')
            ->badge('/icon-192.png')
            ->tag($data['type'])
            ->data([
                'url' => $data['action_url'] ?? null,
                'type' => $data['type'],
            ])
            ->options(['TTL' => 3600]);
    }
}
