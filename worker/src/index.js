export default {
  async fetch(request, env, ctx) {
    return new Response('parachord-edge', { status: 200 });
  }
};
