import S3 from '..'
import { nanoid }  from '../../aws'

export const createShortenUrl = async (redirectUrl: string) => {
  const shortenKey = nanoid()
  const params = {
    Bucket: 'links.dataslot.pro',
    Key: shortenKey,
    WebsiteRedirectLocation: redirectUrl
  }
  // console.log(params)
  return new Promise<string>((resolve) => {
    S3.putObject(params, function(err, data) {
      if (err){
        console.log('err : ', err)
        resolve('')
      }
      else {
        console.log(data)
        // resolve(`links.dataslot.pro/${shortenKey}`)
      }
    })
  })
}

// const q = async () => {
//   const x:string = await createShortenUrl('xcaSDas', 'https://google.com')
//   console.log(x)

// }

// q()