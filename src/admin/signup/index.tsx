import { trpc } from "../../client/trpc";
export default function SignUp() {
  const signupUser = trpc.userSignUp.useMutation({
    onSuccess: () => {
      console.log("signup successfull");
    },

    onError: (error) => {
      console.error(error + "Error trying to sign up user");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const signUpData = {
      email,
      username,
      password,
    };

    try {
      await signupUser.mutateAsync(signUpData);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form className="flex justify-center items-center h-[70vh]" onSubmit={handleSubmit}>
      <fieldset className="text-black p-6 bg-slate-100 rounded-xl flex flex-col gap-4">
        <legend>Sign up</legend>
        <div>
          <label htmlFor="email" className="sr-only">
            email
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
            Username
          </label>
          <input
            type="text"
            name="username"
            id="username"
            placeholder="Enter your username here"
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
          Sign up
        </button>
      </fieldset>
    </form>
  );
}
