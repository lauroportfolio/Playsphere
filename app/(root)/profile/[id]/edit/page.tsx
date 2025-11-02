import AccountProfile from "@/components/forms/AccountProfile";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import SaveProfileButton from "@/components/shared/SaveProfileButton"; // ✅ novo componente para toast

// ✅ Corrige tipagem do Next.js 15 (params é Promise)
type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function EditProfilePage(props: PageProps) {
    const { id } = await props.params; // 👈 aguardando params (corrige o erro)

    const user = await currentUser();
    if (!user) return null;

    // 🔒 Impede edição de outro perfil
    if (user.id !== id) redirect(`/profile/${id}`);

    const userInfo = await fetchUser(user.id);
    if (!userInfo) redirect("/onboarding");

    const userData = {
        id: user.id,
        objectId: userInfo?._id?.toString(), // ✅ converte ObjectId em string
        username: userInfo?.username || user.username,
        name: userInfo?.name || user.firstName || "",
        bio: userInfo?.bio || "",
        image: userInfo?.image || user.imageUrl,
    };

    // ✅ Server action apenas pra salvar (sem toast)
    async function handleSave() {
        "use server";
        console.log("Perfil atualizado com sucesso no servidor!");
        // Aqui você chamaria sua função de updateUser(...)
    }

    return (
        <main className="onboarding-container mt-[-50px]">
            <h1 className="head-text">Editar Perfil</h1>
            <p className="onboarding-p1 text-light-2">
                Altere suas informações pessoais
            </p>

            <section className="onboarding-section">
                {/* ✅ Só o AccountProfile, sem botão duplicado */}
                <AccountProfile user={userData} btnTitle="Salvar Alterações" />

                {/* 🔹 Modal de confirmação */}
                <AlertDialog>
                    <AlertDialogContent className="bg-dark-2 border-none text-light-1">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar alterações</AlertDialogTitle>
                            <AlertDialogDescription className="text-light-2">
                                Deseja realmente salvar as alterações feitas no seu perfil?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-light-4 text-dark-1 hover:bg-light-3">
                                Cancelar
                            </AlertDialogCancel>

                            <AlertDialogAction asChild>
                                <SaveProfileButton onConfirm={handleSave} />
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* 🔹 Botão de voltar ao perfil */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="secondary"
                            className="cursor-pointer w-full mt-4 bg-light-4 text-dark-1"
                        >
                            Voltar ao Perfil
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-dark-2 border-none text-light-1">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
                            <AlertDialogDescription className="text-light-2">
                                Se sair agora, suas alterações serão perdidas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer bg-light-4">
                                Permanecer
                            </AlertDialogCancel>
                            <AlertDialogAction
                                asChild
                                className="bg-primary-500 text-white hover:bg-primary-600"
                            >
                                <Link href={`/profile/${id}`}>Sair sem salvar</Link>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </section>

        </main>
    );
}
