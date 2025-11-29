import { trpc } from "../../client/trpc";

export function SignIn() {
  const userLogin = trpc.userLogin.useMutation({
    onSuccess: () => {
      console.log("Login successful");
    },

    onError: () => {
      console.log("unsuccessful login");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await userLogin.mutateAsync({ email, password });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="flex justify-center items-center h-[80vh]">
      <form className="text-black p-6" onSubmit={handleSubmit}>
        <fieldset className=" p-6 flex flex-col gap-4 bg-slate-100 rounded-lg">
          <legend>Sign in</legend>

          <div>
            <label htmlFor="email" className="sr-only">
              Username
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Enter your email here"
              className="py-2 px-4 outline outline-slate-100 rounded-lg bg-white"
            />
          </div>
          <div>
            <label htmlFor="username" className="sr-only">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Enter your password here"
              className="py-2 px-4 outline outline-slate-100 rounded-lg bg-white"
            />
          </div>

          <button type="submit" className="bg-black text-white py-2 px-4 rounded-lg">
            Login
          </button>
        </fieldset>
      </form>
    </section>
  );
}
