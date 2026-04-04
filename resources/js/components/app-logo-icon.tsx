import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M12,1 L3,6 L5,19 L12,23 L19,19 L21,6 Z M12,4 L6,8 L7.5,17.5 L12,20.5 L16.5,17.5 L18,8 Z M9.5,9 L12,16 L14.5,9 L13,9 L12,12 L11,9 Z" />
        </svg>
    );
}
