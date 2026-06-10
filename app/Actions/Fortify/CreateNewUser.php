<?php

namespace App\Actions\Fortify;

use App\Models\TeamInvitation;
use App\Models\User;
use App\Services\TeamInvitationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email:rfc',
                'max:255',
                'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
            'invitation_token' => ['nullable', 'string', 'exists:team_invitations,token'],
        ])->validate();

        return DB::transaction(function () use ($input) {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            // Handle team invitation if present
            if (! empty($input['invitation_token'])) {
                $invitation = TeamInvitation::where('token', $input['invitation_token'])
                    ->where('status', 'pending')
                    ->first();

                if ($invitation && $invitation->isValid()) {
                    app(TeamInvitationService::class)->acceptInvitation($invitation, $user);
                }
            }

            return $user;
        });
    }
}
