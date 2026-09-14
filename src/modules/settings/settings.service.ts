import { prisma } from "../../lib/prisma";

const getSiteSettings = async () => {
  let setting = await prisma.siteSetting.findFirst();
  if (!setting) {
    setting = await prisma.siteSetting.create({
      data: {
        id: "site_config",
        siteName: "SkillBridge",
        logoUrl: null,
        logoPublicId: null,
        bannerUrl: null,
        bannerPublicId: null,
        bannerTitle: null,
        bannerSubtitle: null,
      },
    });
  }
  return setting;
};

const updateSiteLogo = async (logoUrl: string, logoPublicId: string) => {
  const existing = await getSiteSettings();
  return prisma.siteSetting.update({
    where: { id: existing.id },
    data: {
      logoUrl,
      logoPublicId,
    },
  });
};

const updateSiteBanner = async (bannerUrl: string, bannerPublicId: string) => {
  const existing = await getSiteSettings();
  return prisma.siteSetting.update({
    where: { id: existing.id },
    data: {
      bannerUrl,
      bannerPublicId,
    },
  });
};

const updateSiteTextSettings = async (data: {
  siteName?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
}) => {
  const existing = await getSiteSettings();
  return prisma.siteSetting.update({
    where: { id: existing.id },
    data: {
      ...(data.siteName !== undefined && { siteName: data.siteName }),
      ...(data.bannerTitle !== undefined && { bannerTitle: data.bannerTitle }),
      ...(data.bannerSubtitle !== undefined && { bannerSubtitle: data.bannerSubtitle }),
    },
  });
};

export const SettingsService = {
  getSiteSettings,
  updateSiteLogo,
  updateSiteBanner,
  updateSiteTextSettings,
};
