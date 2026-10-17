<script setup>
import {withBase} from "vitepress";
import {categories} from "../../examples/examples.js";
</script>

<template>
  <section v-for="category in categories" :key="category.name" class="example-category">
    <h2 :id="category.id">{{ category.name }}</h2>
    <p>{{ category.description }}</p>
    <div class="example-grid">
      <a
        v-for="example in category.examples"
        :key="example.slug"
        class="example-card"
        :href="withBase(`/examples/${example.slug}`)"
      >
        <img :src="withBase(`/examples/${example.slug}.webp`)" :alt="example.title" loading="lazy" />
        <span>{{ example.title }}</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.example-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.example-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--vp-c-text-1);
  font-size: 14px;
  text-decoration: none !important;
}

.example-card img {
  aspect-ratio: 16 / 10;
  width: 100%;
  object-fit: cover;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s;
}

.example-card:hover img {
  border-color: var(--vp-c-brand-1);
}

.example-card:hover span {
  color: var(--vp-c-brand-1);
}
</style>
