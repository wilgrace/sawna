const { Clerk } = require('@clerk/clerk-sdk-node');

const clerk = Clerk({ secretKey: 'sk_test_xOOqCtp38m8ZKLVcqn14OiUE4TNapdC3RlmrmaPmu7' });

async function deleteAllUsers() {
  try {
    let offset = 0;
    const limit = 100;
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      // Get users with pagination
      const users = await clerk.users.getUserList({
        limit,
        offset,
      });

      console.log(`Found ${users.length} users in current batch`);

      if (users.length === 0) {
        hasMore = false;
        continue;
      }

      // Delete each user
      for (const user of users) {
        console.log(`Deleting user: ${user.emailAddresses[0]?.emailAddress || user.id}`);
        await clerk.users.deleteUser(user.id);
        totalDeleted++;
      }

      offset += limit;
    }

    console.log(`Successfully deleted ${totalDeleted} users`);
  } catch (error) {
    console.error('Error deleting users:', error);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

deleteAllUsers(); 