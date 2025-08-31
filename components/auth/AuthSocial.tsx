"use client"
import React from 'react'
import { Button } from '../ui/button'
import { FcGoogle } from 'react-icons/fc'
import { FaApple, FaFacebook, FaGithub } from 'react-icons/fa'
// import { signIn } from '../../../auth'
import { signIn } from "next-auth/react"


const AuthSocial = () => {
    return (
        <div className='grid grid-cols-1 gap-3 items-center w-full gap-x-2'>
            <Button
                size="lg"
                variant="outline"
                className="w-full items-center bg-white text-black border border-gray-300 hover:bg-gray-100"
                onClick={() => signIn('google', { callbackUrl: '/auth/auth-callback' })}
            >
                <FcGoogle className='h-5 w-5 mx-3' />
                Continue with Google
            </Button>
            <Button
                onClick={() => signIn('apple', { callbackUrl: '/auth/auth-callback' })}
                className="w-full items-center bg-black text-white hover:bg-gray-800"
            >
                <FaApple className='h-5 w-5 mx-3' />
                Continue with Apple
            </Button>
            <Button
                onClick={() => signIn('facebook', { callbackUrl: '/auth/auth-callback' })}
                className="w-full items-center bg-blue-600 text-white hover:bg-blue-700"
            >
                <FaFacebook className='h-5 w-5 mx-3'  />
                Continue with Facebook
            </Button>

            <Button
                size="lg"
                variant="outline"
                className='w-full'
                onClick={() => { }}
            >
                <FaGithub className='h-5 w-5' />
            </Button>

        </div>
    )
}

export default AuthSocial