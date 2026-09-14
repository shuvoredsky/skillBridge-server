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

export const SettingsService = {
  getSiteSettings,
  updateSiteLogo,
};
