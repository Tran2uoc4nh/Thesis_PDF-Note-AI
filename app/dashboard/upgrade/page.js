'use client'
import React from 'react'
import { PayPalButtons } from '@paypal/react-paypal-js';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useQuery } from 'convex/react';
import { Button } from '@/components/ui/button';
function UpgragePlan() {
  const upgradeUserPlan = useMutation(api.user.userUpgradePlan)
  const { user } = useUser()
  // Lấy thông tin user từ database
  const GetUserInfo = useQuery(api.user.GetUserInfo, {
    userEmail: user?.primaryEmailAddress?.emailAddress
  })
  const onPaymentSuccess = async () => {
    const result = await upgradeUserPlan({ userEmail: user?.primaryEmailAddress?.emailAddress })
    toast.success('Plan upgraded successfully')
  }
  return (
    <div className='h-full flex flex-col items-center justify-center'>
      <h2 className='font-medium text-4xl'>Plans</h2>
      <p className='text-gray-500 pt-4'> Update your plan to upload multiple PDF to take notes and chat with your own</p>
      <div className=" flex mx-auto max-w-3xl px-4 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start md:gap-8">
          {/* Pro Plan */}
          <div
            className={`
              rounded-2xl border p-6 shadow-xs sm:order-last sm:px-8 lg:p-12
              transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer
              ${GetUserInfo?.upgrade
                ? 'border-green-500 ring-2 ring-green-500'
                : 'border-gray-300'
              }
            `}
          >
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900">
                Pro
                <span className="sr-only">Plan</span>
              </h2>

              <p className="mt-2 sm:mt-4">
                <strong className="text-3xl font-bold text-gray-900 sm:text-4xl"> 3.99$ </strong>

                <span className="text-sm font-medium text-gray-700">/One Time</span>
              </p>
            </div>

            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-green-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>

                <span className="text-gray-700"> Unlimited PDF Upload </span>
              </li>

              <li className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-green-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>

                <span className="text-gray-700"> Unlimited Notes Taking </span>
              </li>

              <li className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-green-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>

                <span className="text-gray-700"> Email support </span>
              </li>

              <li className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-green-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>

                <span className="text-gray-700"> Help center access </span>
              </li>

            </ul>

            <div className='mt-8'>
              {GetUserInfo?.upgrade ? (
                <a
                  href="#"
                  className="mt-8 block rounded-full border border-green-500 bg-green-500 text-white px-12 py-3 text-center text-sm font-medium hover:ring-1 hover:ring-green-500 focus:ring-3 focus:outline-hidden"
                >
                  Current Plan
                </a>
              ) : (
                <PayPalButtons
                  onApprove={() => onPaymentSuccess()}
                  onCancel={() => console.log('Payment cancelled')}
                  createOrder={(data, action) => {
                    return action?.order?.create({
                      purchase_units: [{
                        amount: {
                          value: '3.99',
                          currency_code: 'USD',
                        }
                      }]
                    })
                  }}
                />
              )}
            </div>

          </div>


          {/* Starter Plan */}
          <div
            className={`
              rounded-2xl border p-6 shadow-xs sm:px-8 lg:p-12
              transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer
              ${!GetUserInfo?.upgrade
                ? 'border-green-500 ring-2 ring-green-500 shadow-2xl'
                : 'border-gray-300'
              }
            `}
          >
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900">
                Starter
                <span className="sr-only">Plan</span>
              </h2>

              <p className="mt-2 sm:mt-4">
                <strong className="text-3xl font-bold text-gray-900 sm:text-4xl"> 0$ </strong>


              </p>
            </div>

            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-green-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>

                <span className="text-gray-700"> 5 PDF Upload </span>
              </li>

              <li className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-green-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>

                <span className="text-gray-700"> Unlimited Notes Taking </span>
              </li>

              <li className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-green-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>

                <span className="text-gray-700"> Email support </span>
              </li>

              <li className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-green-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>

                <span className="text-gray-700"> Help center access </span>
              </li>
            </ul>

            {!GetUserInfo?.upgrade && (
              <a
                href="#"
                className="mt-8 block rounded-full border border-green-500 bg-green-500 text-white px-12 py-3 text-center text-sm font-medium hover:ring-1 hover:ring-green-500 focus:ring-3 focus:outline-hidden"
              >
                Current Plan
              </a>
            )}


          </div>
        </div>
      </div>

    </div>
  )
}



export default UpgragePlan