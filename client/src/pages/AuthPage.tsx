import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type FormData = {
  username: string;
  password: string;
};

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useUser();
  const { toast } = useToast();
  const form = useForm<FormData>();

  const onSubmit = async (data: FormData, isRegister: boolean) => {
    setIsLoading(true);
    try {
      if (isRegister) {
        await register(data);
        toast({
          title: "Registration successful",
          description: "Welcome to ChatGenius!",
        });
      } else {
        await login(data);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">ChatGenius</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))}>
                <div className="space-y-4">
                  <Input
                    placeholder="Username"
                    {...form.register("username", { required: true })}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    {...form.register("password", { required: true })}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        Logging in...
                      </div>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={form.handleSubmit((data) => onSubmit(data, true))}>
                <div className="space-y-4">
                  <Input
                    placeholder="Username"
                    {...form.register("username", { required: true })}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    {...form.register("password", { required: true })}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        Registering...
                      </div>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
