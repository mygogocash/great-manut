import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";

const PasswordProvider = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: ((params.name as string) || (params.email as string)).trim(),
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub, Google, PasswordProvider],
});
