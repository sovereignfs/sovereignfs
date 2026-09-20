<script setup lang="ts">
import { watchEffect } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import HomePage from './HomePage.vue';
import HomePageOS from './HomePageOS.vue';
import HomePageEdge from './HomePageEdge.vue';

const { frontmatter, theme, page } = useData();

// One entry per product that gets its own section of the site. Adding a
// product here is the whole change — the previous shape declared a repo
// const, a nav const, a socialLinks const and a watchEffect branch per
// product, which is four places to forget when a fifth product arrives.
// Products that stand on their own, and so get their own nav: Sovereign OS is
// a Raspberry Pi appliance and Sovereign Edge a standalone offline app —
// neither shares a codebase with the runtime, and the runtime's nav items
// (Instances, Get Started, Docs) mean nothing on their pages.
//
// sovereign-desktop and sovereign-mobile are deliberately NOT here. They're
// native shells that load a user's own Sovereign instance, so they keep the
// full Sovereign nav: a reader on those pages still wants Instances and Docs.
const subProducts: Array<{ prefix: string; repo: string; roadmapLink?: string }> = [
  { prefix: 'sovereign-os/', repo: 'sovereign-os', roadmapLink: '/sovereign-os/roadmap' },
  { prefix: 'sovereign-edge/', repo: 'sovereign-edge', roadmapLink: '/sovereign-edge/roadmap' },
];

// Keep the shared Products dropdown, add the product's own Roadmap, and point
// GitHub at its own repo. Products/GitHub are filtered from config.ts's nav so
// there's one source of truth for both.
const rootNav = theme.value.nav;
const rootSocialLinks = theme.value.socialLinks;

function repoUrl(repo: string) {
  return `https://github.com/sovereignfs/${repo}`;
}

function buildSubProductNav(repo: string, roadmapLink?: string) {
  return rootNav
    ?.filter((item) => 'text' in item && (item.text === 'Product' || item.text === 'GitHub'))
    .flatMap((item) => {
      if ('text' in item && item.text === 'GitHub') return [{ text: 'GitHub', link: repoUrl(repo) }];
      return roadmapLink ? [item, { text: 'Roadmap', link: roadmapLink }] : [item];
    });
}

function buildSubProductSocialLinks(repo: string) {
  return rootSocialLinks?.map((link) =>
    link.icon === 'github' ? { ...link, link: repoUrl(repo) } : link,
  );
}

const subProductThemes = subProducts.map((product) => ({
  prefix: product.prefix,
  nav: buildSubProductNav(product.repo, product.roadmapLink),
  socialLinks: buildSubProductSocialLinks(product.repo),
}));

watchEffect(() => {
  const active = subProductThemes.find((product) =>
    page.value.relativePath.startsWith(product.prefix),
  );
  theme.value.nav = active ? active.nav : rootNav;
  theme.value.socialLinks = active ? active.socialLinks : rootSocialLinks;
});
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-before>
      <HomePage v-if="frontmatter.sovereignHome" />
      <HomePageOS v-if="frontmatter.sovereignOsHome" />
      <HomePageEdge v-if="frontmatter.sovereignEdgeHome" />
    </template>

    <!-- Set by config.ts's transformPageData, from docs-sync.manifest.json. -->
    <template #doc-footer-before>
      <p v-if="frontmatter.sourceUrl" class="sv-source-link">
        <a :href="frontmatter.sourceUrl" target="_blank" rel="noreferrer">
          View this page’s source
        </a>
      </p>
    </template>
  </DefaultTheme.Layout>
</template>
