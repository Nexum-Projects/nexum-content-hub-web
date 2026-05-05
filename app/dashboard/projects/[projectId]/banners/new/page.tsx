import { BannerForm } from "@/components/banners/banner-form";

export default async function NewBannerPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <BannerForm projectId={projectId} />;
}
