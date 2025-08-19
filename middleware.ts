// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define rotas públicas (sem necessidade de login)
const isPublicRoute = createRouteMatcher([
  "/",                // página inicial
  "/sign-in(.*)",     // login
  "/sign-up(.*)",     // cadastro
  "/api/webhook/clerk", // webhook não autenticado
]);

export default clerkMiddleware(async (auth, req) => {
  // Se a rota não for pública, exige autenticação
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Pega todas as rotas, menos arquivos estáticos e internos do Next
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Sempre rodar para APIs
    "/(api|trpc)(.*)",
  ],
};
