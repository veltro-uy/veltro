import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fillRule="evenodd"
                d="M12,1 L22,9 L19,21 L5,21 L2,9 Z M6.5,6.5 L12,18 L17.5,6.5 L15,6.5 L12,13.5 L9,6.5 Z"
            />
        </svg>
    );
}
