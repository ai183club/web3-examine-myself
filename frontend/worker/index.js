const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404) {
      return response;
    }

    const pathname = new URL(request.url).pathname;
    if (pathname.includes(".")) {
      return response;
    }

    return Response.redirect(new URL("/index.html", request.url), 302);
  },
};

export default worker;
