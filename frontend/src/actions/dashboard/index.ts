'use server'

import { headers } from 'next/dist/server/request/headers'
import { auth } from '~/lib/auth'
import { client } from '~/lib/prisma'


const onGetAccounts = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
      })

      if(!session) return null
      const userId = session.user.id
      if(!userId) return null 
      const accounts = await client.brokerAccount.findMany({
        where: {
          userId,
        },
        select: {
            brokerName: true,
            platform: true,
            accountNumber: true,
            server: true,
            trades: true,
            
        }
      })
    }

