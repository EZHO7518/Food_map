import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <script
          src="//dapi.kakao.com/v2/maps/sdk.js?appkey=0dbc37011c6b4aa197010b976d3c290d&libraries=services&autoload=false"
          async
        ></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
