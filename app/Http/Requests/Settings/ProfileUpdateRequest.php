<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use App\Rules\CleanText;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', new CleanText],

            'email' => [
                'required',
                'string',
                'lowercase',
                'email:rfc',
                'max:255',
                'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],

            'phone_number' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[\+]?[0-9\s\-\(\)]+$/',
            ],

            'bio' => [
                'nullable',
                'string',
                'max:500',
            ],

            'location' => [
                'nullable',
                'string',
                'max:100',
                new CleanText,
            ],

            'date_of_birth' => [
                'nullable',
                'date',
                'before:today',
                'after:'.now()->subYears(100)->format('Y-m-d'),
            ],
        ];
    }

    /**
     * Extra checks that must run even when a field is submitted empty
     * (the `nullable` rule short-circuits normal rules on empty values).
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $user = $this->user();

                // Only the *clearing* transition is blocked. Leaders who never
                // had a phone number (grandfathered) can still edit their
                // profile freely.
                if (! $this->has('phone_number')) {
                    return;
                }

                if (blank($this->input('phone_number'))
                    && filled($user->phone_number)
                    && $user->leadsAnyTeam()) {
                    $validator->errors()->add(
                        'phone_number',
                        'No podés quitar tu número de teléfono mientras seas capitán o vice-capitán de un equipo. Los equipos rivales lo necesitan para coordinar los partidos.'
                    );
                }
            },
        ];
    }
}
