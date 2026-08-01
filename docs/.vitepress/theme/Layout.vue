<script setup lang="ts">
import { watchEffect } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import HomePage from './HomePage.vue';
import HomePageOS from './HomePageOS.vue';
import HomePageEdge from './HomePageEdge.vue';

const { frontmatter, theme, page } = useData();

const sovereignOsRepo = 'https://github.com/sovereignfs/sovereign-os';
const sovereignEdgeRepo = 'https://github.com/sovereignfs/sovereign-edge';

// Sovereign OS/Edge pages don't need sovereign-runtime-specific nav items
// (Instances, Get Started, Docs) — keep the shared Products dropdown, add
// the sub-product's own Roadmap, and GitHub. Products/GitHub are filtered
// from config.ts's nav so there's one source of truth; GitHub's link/icon
// also need to point at the sub-product's own repo there, not sovereign's.
const rootNav = theme.value.nav;
const rootSocialLinks = theme.value.socialLinks;

function buildSubProductNav(repo: string, roadmapLink: string) {
  return rootNav
    ?.filter((item) => 'text' in item && (item.text === 'Product' || item.text === 'GitHub'))
    .flatMap((item) => {
      if ('text' in item && item.text === 'GitHub') return [{ text: 'GitHub', link: repo }];
      return [item, { text: 'Roadmap', link: roadmapLink }];
    });
}

function buildSubProductSocialLinks(repo: string) {
  return rootSocialLinks?.map((link) => (link.icon === 'github' ? { ...link, link: repo } : link));
}

const osNav = buildSubProductNav(sovereignOsRepo, '/sovereign-os/roadmap');
const osSocialLinks = buildSubProductSocialLinks(sovereignOsRepo);

const edgeNav = buildSubProductNav(sovereignEdgeRepo, '/sovereign-edge/roadmap');
const edgeSocialLinks = buildSubProductSocialLinks(sovereignEdgeRepo);

watchEffect(() => {
  const isOs = page.value.relativePath.startsWith('sovereign-os/');
  const isEdge = page.value.relativePath.startsWith('sovereign-edge/');
  theme.value.nav = isOs ? osNav : isEdge ? edgeNav : rootNav;
  theme.value.socialLinks = isOs ? osSocialLinks : isEdge ? edgeSocialLinks : rootSocialLinks;
});
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-before>
      <HomePage v-if="frontmatter.sovereignHome" />
      <HomePageOS v-if="frontmatter.sovereignOsHome" />
      <HomePageEdge v-if="frontmatter.sovereignEdgeHome" />
    </template>
  </DefaultTheme.Layout>
</template>
