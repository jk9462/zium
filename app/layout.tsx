// layout.tsx의 metadata를 이 내용으로 교체하세요
// ─── Cursor에서 app/layout.tsx 파일의 metadata 부분을 이 코드로 교체 ───

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "지움 | 내 개인정보, 지워드립니다",
  description: "내 이메일과 전화번호가 어디에 유출됐는지 무료로 확인하세요. 유출된 개인정보를 법적으로 삭제 요청해드립니다.",
  keywords: ["개인정보", "유출", "삭제", "스팸", "데이터 보호", "개인정보보호"],
  openGraph: {
    title: "지움 | 내 개인정보, 지워드립니다",
    description: "내 개인정보가 어디에 유출됐는지 무료로 확인하세요. 30초면 됩니다.",
    url: "https://zium.kr",
    siteName: "지움",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png", // 1200x630 이미지 필요 (아래 가이드 참고)
        width: 1200,
        height: 630,
        alt: "지움 - 내 개인정보 유출 확인 및 삭제 서비스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "지움 | 내 개인정보, 지워드립니다",
    description: "내 개인정보가 어디에 유출됐는지 무료로 확인하세요.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ⚠️ GA_TRACKING_ID를 실제 GA4 측정 ID로 교체하세요 (예: G-XXXXXXXXXX)
  const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX";

  return (
    <html lang="ko">
      <head>
        {/* GA4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_title: document.title,
              send_page_view: true
            });
          `}
        </Script>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

/*
═══════════════════════════════════════════
  설정 가이드
═══════════════════════════════════════════

1. GA4 설정:
   - https://analytics.google.com 에서 속성 생성
   - 측정 ID (G-XXXXXXXXXX) 복사
   - .env.local 파일에 추가: NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

2. OG 이미지 (1200x630):
   - Canva에서 제작 추천
   - public/og-image.png 로 저장
   - 텍스트: "내 개인정보, 어디에 유출됐을까?" + 지움 로고

3. Favicon:
   - public/favicon.svg 는 별도 생성됨

4. Airtable 웹훅 (사전등록 이메일 저장):
   - Airtable에서 테이블 생성 (columns: email, plan, leakCount, timestamp, source)
   - Airtable Automations > Webhook trigger 생성
   - .env.local에 추가: AIRTABLE_WEBHOOK_URL=https://hooks.airtable.com/...
   - ⚠️ NEXT_PUBLIC_ 접두사 사용 금지! (서버 전용 환경변수)

═══════════════════════════════════════════
*/