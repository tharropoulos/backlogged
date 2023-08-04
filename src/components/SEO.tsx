import Head from "next/head";
type MainLayoutProps = {
  title: string;
  description?: string;
};

export function SEO({ title, description }: MainLayoutProps): JSX.Element {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="icon" href="/favicon.ico" />
      {description && <meta name="description" content={description} />}
      {description && <meta name="og:description" content={description} />}
    </Head>
  );
}
