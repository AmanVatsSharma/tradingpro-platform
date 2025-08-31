import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { AuthHeader } from './AuthHeader'
import AuthSocial from './AuthSocial'
import AuthBackButton from './AuthBackButton'

type CardWrapperProps = {
    children: React.ReactNode,
    headerLabel: string,
    backButtonLabel: string,
    backButtonHref: string,
    showSocial?: boolean
}

const CardWrapper = ({
    children,
    headerLabel,
    backButtonHref,
    backButtonLabel,
    showSocial
}: CardWrapperProps) => {
    return (
        <Card className='w-[400px] shadow-md' >
            <CardHeader>
                <AuthHeader label={headerLabel}/>
            </CardHeader>
            <CardContent>
            {children}
            </CardContent>
            {showSocial && (
                <CardFooter>
                    <AuthSocial/>
                </CardFooter>
            )}
            <CardFooter>
                <AuthBackButton
                label={backButtonLabel}
                href={backButtonHref}
                />
            </CardFooter>
        </Card>
    )
}

export default CardWrapper