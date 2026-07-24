<script setup lang="ts">
import { watchEffect } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import HomePage from './HomePage.vue';
import HomePageOS from './HomePageOS.vue';

const { frontmatter, theme, page } = useData();

const sovereignOsRepo = 'https://github.com/sovereignfs/sovereign-os';

// Sovereign OS pages don't need sovereign-runtime-specific nav items
// (Instances, Get Started, Docs) — keep the shared Products dropdown, add
// sovereign-os's own Roadmap, and GitHub. Products/GitHub are filtered from
// config.ts's nav so there's one source of truth; GitHub's link/icon also
// need to point at sovereign-os's own repo there, not sovereign's.
const rootNav = theme.value.nav;
const rootSocialLinks = theme.value.socialLinks;

const osNav = rootNav
  ?.filter((item) => 'text' in item && (item.text === 'Product' || item.text === 'GitHub'))
  .flatMap((item) => {
    if ('text' in item && item.text === 'GitHub') return [{ text: 'GitHub', link: sovereignOsRepo }];
    return [item, { text: 'Roadmap', link: '/sovereign-os/roadmap' }];
  });

const osSocialLinks = rootSocialLinks?.map((link) =>
  link.icon === 'github' ? { ...link, link: sovereignOsRepo } : link,
);

watchEffect(() => {
  const isOs = page.value.relativePath.startsWith('sovereign-os/');
  theme.value.nav = isOs ? osNav : rootNav;
  theme.value.socialLinks = isOs ? osSocialLinks : rootSocialLinks;
});
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-before>
      <HomePage v-if="frontmatter.sovereignHome" />
      <HomePageOS v-if="frontmatter.sovereignOsHome" />
    </template>
  </DefaultTheme.Layout>
</template>
