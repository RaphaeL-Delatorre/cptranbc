import { useMemo, useState } from "react";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Key, Trash2, Shield, IdCard } from "lucide-react";
import {
  useCargos,
  useCargoPermissoes,
  useCargos as useCargosList,
  useCreateCargo,
  useDeleteCargo,
  usePermissoes,
  useSetCargoPermissoes,
  useSetUserCargo,
  useSystemUsers,
  useUpdateUserRg,
} from "@/hooks/useSystem";
import { useCreateSystemUser, useDeleteSystemUser, useUpdateSystemUserPassword } from "@/hooks/useSystemUserAdmin";

const rgSchema = z.string().trim().regex(/^\d+$/, "RG deve conter apenas números").min(1).max(30);
const nomeSchema = z
  .string()
  .trim()
  .min(3)
  .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, { message: "Informe Nome e Sobrenome" });

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");

const buildEmail = (rg: string) => {
  const clean = rg.trim();
  return `${clean}@cptran.gov.br`;
};

export const SystemContent = () => {
  const { toast } = useToast();
  const { data: users = [], isLoading: usersLoading } = useSystemUsers();
  const { data: cargos = [], isLoading: cargosLoading } = useCargosList();

  const createUser = useCreateSystemUser();
  const deleteUser = useDeleteSystemUser();
  const updatePassword = useUpdateSystemUserPassword();

  const setUserCargo = useSetUserCargo();
  const updateUserRg = useUpdateUserRg();

  const createCargo = useCreateCargo();
  const deleteCargo = useDeleteCargo();

  const { data: permissoes = [], isLoading: permissoesLoading } = usePermissoes();
  const setCargoPermissoes = useSetCargoPermissoes();

  const [tab, setTab] = useState<"usuarios" | "cargos">("usuarios");

  // dialogs state
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ nome: "", rg: "", password: "", confirm: "", cargoId: "" });

  const [userCargoOpenFor, setUserCargoOpenFor] = useState<string | null>(null);
  const [userCargoId, setUserCargoId] = useState<string>("");

  const [userPasswordOpenFor, setUserPasswordOpenFor] = useState<string | null>(null);
  const [userNewPassword, setUserNewPassword] = useState("");

  const [userRgOpenFor, setUserRgOpenFor] = useState<string | null>(null);
  const [userNewRg, setUserNewRg] = useState("");

  const [cargoOpen, setCargoOpen] = useState(false);
  const [cargoForm, setCargoForm] = useState({ nome: "", descricao: "" });

  const [cargoPermOpenFor, setCargoPermOpenFor] = useState<string | null>(null);
  const { data: cargoPermIds = [] } = useCargoPermissoes(cargoPermOpenFor || undefined);
  const [cargoSelectedPerms, setCargoSelectedPerms] = useState<string[]>([]);

  const permissoesByCategoria = useMemo(() => {
    const map = new Map<string, typeof permissoes>();
    permissoes.forEach((p) => {
      const arr = map.get(p.categoria) ?? [];
      arr.push(p);
      map.set(p.categoria, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissoes]);

  const openCargoPerms = (cargoId: string) => {
    setCargoPermOpenFor(cargoId);
    setCargoSelectedPerms(cargoPermIds);
  };

  // keep selection in sync when query returns
  useMemo(() => {
    if (cargoPermOpenFor) setCargoSelectedPerms(cargoPermIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargoPermIds, cargoPermOpenFor]);

  const handleCreateUser = async () => {
    const nomeParsed = nomeSchema.safeParse(newUser.nome);
    if (!nomeParsed.success) {
      toast({ title: "Erro", description: nomeParsed.error.errors[0]?.message, variant: "destructive" });
      return;
    }
    const rgParsed = rgSchema.safeParse(newUser.rg);
    if (!rgParsed.success) {
      toast({ title: "Erro", description: rgParsed.error.errors[0]?.message, variant: "destructive" });
      return;
    }
    if (newUser.password.length < 8 || !/[A-Za-z]/.test(newUser.password) || !/\d/.test(newUser.password)) {
      toast({ title: "Erro", description: "Use uma senha mais forte (mín. 8 caracteres, com letras e números).", variant: "destructive" });
      return;
    }
    if (newUser.password !== newUser.confirm) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }

    const email = buildEmail(newUser.rg);

    try {
      await createUser.mutateAsync({
        nome: newUser.nome.trim(),
        rg: newUser.rg.trim(),
        password: newUser.password,
        email,
        cargoId: newUser.cargoId || null,
      });
      toast({ title: "Usuário criado", description: `Conta criada para ${email}` });
      setNewUserOpen(false);
      setNewUser({ nome: "", rg: "", password: "", confirm: "", cargoId: "" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Não foi possível criar o usuário.", variant: "destructive" });
    }
  };

  const handleSetUserCargo = async () => {
    if (!userCargoOpenFor) return;
    try {
      await setUserCargo.mutateAsync({ userId: userCargoOpenFor, cargoId: userCargoId || null });
      toast({ title: "Cargo atualizado", description: "Cargo do usuário atualizado." });
      setUserCargoOpenFor(null);
      setUserCargoId("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Erro ao atualizar cargo.", variant: "destructive" });
    }
  };

  const handleUpdateUserPassword = async () => {
    if (!userPasswordOpenFor) return;
    if (userNewPassword.length < 8 || !/[A-Za-z]/.test(userNewPassword) || !/\d/.test(userNewPassword)) {
      toast({ title: "Erro", description: "Use uma senha mais forte (mín. 8 caracteres, com letras e números).", variant: "destructive" });
      return;
    }
    try {
      await updatePassword.mutateAsync({ userId: userPasswordOpenFor, newPassword: userNewPassword });
      toast({ title: "Senha alterada", description: "Senha atualizada com sucesso." });
      setUserPasswordOpenFor(null);
      setUserNewPassword("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Erro ao alterar senha.", variant: "destructive" });
    }
  };

  const handleUpdateUserRg = async () => {
    if (!userRgOpenFor) return;
    const rgParsed = rgSchema.safeParse(userNewRg);
    if (!rgParsed.success) {
      toast({ title: "Erro", description: rgParsed.error.errors[0]?.message, variant: "destructive" });
      return;
    }
    try {
      await updateUserRg.mutateAsync({ userId: userRgOpenFor, rg: userNewRg.trim() });
      toast({ title: "RG atualizado", description: "RG atualizado com sucesso." });
      setUserRgOpenFor(null);
      setUserNewRg("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Erro ao atualizar RG.", variant: "destructive" });
    }
  };

  const handleCreateCargo = async () => {
    const nomeParsed = z.string().trim().min(2).safeParse(cargoForm.nome);
    if (!nomeParsed.success) {
      toast({ title: "Erro", description: "Informe o nome do cargo.", variant: "destructive" });
      return;
    }
    try {
      await createCargo.mutateAsync({ nome: cargoForm.nome.trim(), descricao: cargoForm.descricao.trim() || undefined });
      toast({ title: "Cargo criado", description: "Cargo criado com sucesso." });
      setCargoOpen(false);
      setCargoForm({ nome: "", descricao: "" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Erro ao criar cargo.", variant: "destructive" });
    }
  };

  const handleSaveCargoPerms = async () => {
    if (!cargoPermOpenFor) return;
    try {
      await setCargoPermissoes.mutateAsync({ cargoId: cargoPermOpenFor, permissaoIds: cargoSelectedPerms });
      toast({ title: "Permissões atualizadas", description: "Permissões do cargo atualizadas." });
      setCargoPermOpenFor(null);
      setCargoSelectedPerms([]);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Erro ao salvar permissões.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Configurações do Sistema</h2>
          <p className="text-muted-foreground text-sm">Gerencie usuários, cargos e permissões</p>
        </div>
        {tab === "usuarios" ? (
          <Button className="gap-2" onClick={() => setNewUserOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Usuário
          </Button>
        ) : (
          <Button className="gap-2" onClick={() => setCargoOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Cargo
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="cargos">Cargos e Permissões</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
            {usersLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-sm">RG</th>
                      <th className="text-left p-4 font-semibold text-sm">Nome</th>
                      <th className="text-left p-4 font-semibold text-sm">Email</th>
                      <th className="text-left p-4 font-semibold text-sm">Cargo</th>
                      <th className="text-right p-4 font-semibold text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {users.map((u) => (
                      <tr key={u.user_id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-muted-foreground">{u.rg || "-"}</td>
                        <td className="p-4 font-medium">{u.nome}</td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4">{u.cargo?.nome || "-"}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end flex-wrap items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => {
                                setUserCargoOpenFor(u.user_id);
                                setUserCargoId(u.cargo?.id || "");
                              }}
                            >
                              <Shield className="h-4 w-4" /> Cargo
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => {
                                setUserRgOpenFor(u.user_id);
                                setUserNewRg(u.rg || "");
                              }}
                            >
                              <IdCard className="h-4 w-4" /> RG
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => {
                                setUserPasswordOpenFor(u.user_id);
                                setUserNewPassword("");
                              }}
                            >
                              <Key className="h-4 w-4" /> Senha
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                              onClick={async () => {
                                if (!confirm(`Excluir a conta de ${u.nome}?`)) return;
                                try {
                                  await deleteUser.mutateAsync(u.user_id);
                                  toast({ title: "Usuário excluído", description: "Conta removida." });
                                } catch (e: any) {
                                  toast({ title: "Erro", description: e.message || "Erro ao excluir usuário.", variant: "destructive" });
                                }
                              }}
                              disabled={deleteUser.isPending}
                            >
                              {deleteUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Novo Usuário */}
          <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>Preencha as informações para criar um novo usuário.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>RG</Label>
                  <Input value={newUser.rg} onChange={(e) => setNewUser({ ...newUser, rg: e.target.value })} placeholder="Somente números" />
                </div>
                <div className="space-y-2">
                  <Label>Nome e Sobrenome</Label>
                  <Input value={newUser.nome} onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })} placeholder="Nome completo" />
                  {newUser.rg.trim().length > 0 && (
                    <p className="text-xs text-muted-foreground">Email: {buildEmail(newUser.rg)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Senha</Label>
                  <Input type="password" value={newUser.confirm} onChange={(e) => setNewUser({ ...newUser, confirm: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Select value={newUser.cargoId} onValueChange={(v) => setNewUser({ ...newUser, cargoId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={cargosLoading ? "Carregando..." : "Selecione um cargo"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem cargo</SelectItem>
                      {cargos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateUser} disabled={createUser.isPending}>
                  {createUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cargo do usuário */}
          <Dialog open={!!userCargoOpenFor} onOpenChange={(o) => !o && setUserCargoOpenFor(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Definir Cargo</DialogTitle>
                <DialogDescription>Escolha o cargo do usuário.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={userCargoId} onValueChange={setUserCargoId}>
                  <SelectTrigger>
                    <SelectValue placeholder={cargosLoading ? "Carregando..." : "Selecione um cargo"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem cargo</SelectItem>
                    {cargos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={handleSetUserCargo} disabled={setUserCargo.isPending}>
                  {setUserCargo.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Alterar RG */}
          <Dialog open={!!userRgOpenFor} onOpenChange={(o) => !o && setUserRgOpenFor(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar RG</DialogTitle>
                <DialogDescription>Informe o novo RG (somente números).</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Novo RG</Label>
                <Input value={userNewRg} onChange={(e) => setUserNewRg(e.target.value)} placeholder="Somente números" />
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateUserRg} disabled={updateUserRg.isPending}>
                  {updateUserRg.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Alterar Senha */}
          <Dialog open={!!userPasswordOpenFor} onOpenChange={(o) => !o && setUserPasswordOpenFor(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
                <DialogDescription>Defina uma nova senha para o usuário.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input type="password" value={userNewPassword} onChange={(e) => setUserNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateUserPassword} disabled={updatePassword.isPending}>
                  {updatePassword.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="cargos">
          <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
            {cargosLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-sm">ID</th>
                      <th className="text-left p-4 font-semibold text-sm">Nome</th>
                      <th className="text-left p-4 font-semibold text-sm">Descrição</th>
                      <th className="text-right p-4 font-semibold text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {cargos.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-muted-foreground">{c.id}</td>
                        <td className="p-4 font-medium">{c.nome}</td>
                        <td className="p-4 text-muted-foreground">{c.descricao || "-"}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end flex-wrap items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => openCargoPerms(c.id)}
                            >
                              <Shield className="h-4 w-4" /> Permissões
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                              onClick={async () => {
                                if (!confirm(`Excluir o cargo ${c.nome}?`)) return;
                                try {
                                  await deleteCargo.mutateAsync(c.id);
                                  toast({ title: "Cargo excluído", description: "Cargo removido." });
                                } catch (e: any) {
                                  toast({ title: "Erro", description: e.message || "Erro ao excluir cargo.", variant: "destructive" });
                                }
                              }}
                              disabled={deleteCargo.isPending}
                            >
                              {deleteCargo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Novo cargo */}
          <Dialog open={cargoOpen} onOpenChange={setCargoOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cargo</DialogTitle>
                <DialogDescription>Crie um novo cargo para o sistema.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={cargoForm.nome} onChange={(e) => setCargoForm({ ...cargoForm, nome: e.target.value })} placeholder="Nome do cargo" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={cargoForm.descricao} onChange={(e) => setCargoForm({ ...cargoForm, descricao: e.target.value })} placeholder="Descrição" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateCargo} disabled={createCargo.isPending}>
                  {createCargo.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Permissões do cargo */}
          <Dialog open={!!cargoPermOpenFor} onOpenChange={(o) => !o && setCargoPermOpenFor(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Permissões do Cargo</DialogTitle>
                <DialogDescription>Selecione as permissões que este cargo terá.</DialogDescription>
              </DialogHeader>

              {permissoesLoading ? (
                <div className="py-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
              ) : (
                <div className="space-y-6 max-h-[60vh] overflow-auto pr-2">
                  {permissoesByCategoria.map(([cat, perms]) => (
                    <div key={cat} className="space-y-2">
                      <h4 className="font-semibold">{cat}</h4>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((p) => {
                          const active = cargoSelectedPerms.includes(p.id);
                          return (
                            <Button
                              key={p.id}
                              type="button"
                              size="sm"
                              variant={active ? "default" : "outline"}
                              onClick={() => {
                                setCargoSelectedPerms((prev) =>
                                  prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                                );
                              }}
                            >
                              {p.nome}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button onClick={handleSaveCargoPerms} disabled={setCargoPermissoes.isPending}>
                  {setCargoPermissoes.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};
