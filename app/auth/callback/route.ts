import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect address
  const next = searchParams.get('next') ?? '/'
  const authIntent = searchParams.get('auth_intent')

  const buildRedirectResponse = (target: string) => {
    const response = NextResponse.redirect(target)
    response.cookies.set('oauth_signup_user_type', '', {
      path: '/',
      maxAge: 0,
    })
    return response
  }

  if (code) {
    const cookieStore = await cookies()
    const selectedOAuthUserType = cookieStore.get('oauth_signup_user_type')?.value
    const isSelectedOAuthUserTypeValid =
      selectedOAuthUserType === 'student' || selectedOAuthUserType === 'landlord'

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, created_at')
          .eq('id', user.id)
          .single()

        const profileCreatedAt = profile?.created_at ? new Date(profile.created_at).getTime() : 0
        const isFreshOAuthSignup =
          Boolean(profileCreatedAt) && Date.now() - profileCreatedAt < 10 * 60 * 1000

        if (
          authIntent === 'signup' &&
          isSelectedOAuthUserTypeValid &&
          profile &&
          isFreshOAuthSignup &&
          profile.user_type !== selectedOAuthUserType
        ) {
          await supabase
            .from('profiles')
            .update({ user_type: selectedOAuthUserType })
            .eq('id', user.id)

          await supabase.auth.updateUser({
            data: { user_type: selectedOAuthUserType },
          })
        } else if (!user.user_metadata?.user_type && profile?.user_type) {
          // Sync user_type from profiles table into auth metadata.
          // This is needed for OAuth (e.g. Google) sign-ins where user_type
          // is never written to auth user_metadata during the OAuth flow.
          await supabase.auth.updateUser({
            data: { user_type: profile.user_type },
          })
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // i.e. vercel.com
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that origin is http://localhost:3000
        return buildRedirectResponse(`${origin}${next}`)
      } else if (forwardedHost) {
        return buildRedirectResponse(`https://${forwardedHost}${next}`)
      } else {
        return buildRedirectResponse(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return buildRedirectResponse(`${origin}/auth/error`)
}
