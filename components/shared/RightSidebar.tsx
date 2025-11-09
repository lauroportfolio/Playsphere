import UserCard from "../cards/UserCard";
import { fetchCommunities } from "@/lib/actions/community.actions";
import { fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";

function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function RightSidebar() {
  const user = await currentUser();
  if (!user) return null;

  const similarMinds = await fetchUsers({
    userId: user.id,
    pageSize: 100, // pegar muitos para ter variedade
  });

  const suggestedCommunities = await fetchCommunities({
    pageSize: 100,
  });

  const displayUsers = shuffleArray(similarMinds.users || []).slice(0, 4);
  const displayCommunities = shuffleArray(suggestedCommunities.communities || []).slice(0, 4);

  return (
    <section className='custom-scrollbar rightsidebar'>
      <div className='flex flex-1 flex-col justify-start'>
        <h3 className='text-heading4-medium text-light-1'>
          Comunidades Sugeridas
        </h3>

        <div className='mt-7 flex w-[350px] flex-col gap-9'>
          {displayCommunities.length > 0 ? (
            displayCommunities.map((community) => (
              <UserCard
                key={community.id}
                id={community.id}
                name={community.name}
                username={community.username}
                imgUrl={community.image}
                personType='Community'
              />
            ))
          ) : (
            <p className='base-regular text-light-3'>
              Sem comunidades criadas
            </p>
          )}
        </div>
      </div>

      <div className='flex flex-1 flex-col justify-start'>
        <h3 className='text-heading4-medium text-light-1'>Usuários Sugeridos</h3>
        <div className='mt-7 flex w-[350px] flex-col gap-10'>
          {displayUsers.length > 0 ? (
            displayUsers.map((person) => (
              <UserCard
                key={person.id}
                id={person.id}
                name={person.name}
                username={person.username}
                imgUrl={person.image}
                personType='User'
              />
            ))
          ) : (
            <p className='base-regular text-light-3'>Sem usuários sugeridos</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default RightSidebar;