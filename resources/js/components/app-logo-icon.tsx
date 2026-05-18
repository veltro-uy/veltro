import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                d="M4.09 4.25c.5-.83 1.72-.81 2.18.05l5.82 10.86 5.66-10.84a1.25 1.25 0 0 1 2.22 1.16l-6.76 12.95a1.25 1.25 0 0 1-2.21.01L4.05 5.5a1.25 1.25 0 0 1 .04-1.25Z"
                clipRule="evenodd"
            />
            <path
                fillRule="evenodd"
                d="M8.18 4.12c.62-.31 1.37-.06 1.68.56l3.9 7.79 1.53-2.97a1.25 1.25 0 1 1 2.22 1.14l-2.65 5.16a1.25 1.25 0 0 1-2.23 0L7.62 5.8a1.25 1.25 0 0 1 .56-1.68Z"
                clipRule="evenodd"
                opacity="0.52"
            />
            <path
                fillRule="evenodd"
                d="M17.95 17.15a1.25 1.25 0 0 1 1.67.58l.71 1.45a1.25 1.25 0 1 1-2.25 1.1l-.71-1.45a1.25 1.25 0 0 1 .58-1.68Z"
                clipRule="evenodd"
            />
        </svg>
    );
}
