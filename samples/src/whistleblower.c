/*
 * Whistleblower - Illegal NNTP Content Scanner
 *
 * Copyright (c) 2003 KSAJ Inc., www.PENETRATIONTEST.com
 *
 * This program is a proof-of-concept experiment.  There is
 *	no waranty whatsoever. 
 *
 *	INPUT:  	IP address or host.domain of the NNTP server
 *			Optional username / password
 *
 *	PROCESS:	NNTP server is scanned for the existance of
 *			active newsgroups that are listed in separate
 *			files.  The newsgroup lists consist of
 *			groups with child pornography, warez and
 *			music trading.  Non-existent newsgroups and
 *			Newsgroups with 0 messages are ignored.
 *			The number of groups found from each 
 *			category is tallied.
 * 
 *	OUTPUT:		If the NNTP server holds any of the listed
 *			groups, a page is presented with a tally of
 *			the number of groups in each category. A
 *			total number of groups is listed.  The top
 *			10 offending sites are displayed.  If the
 *			site just scanned is a top offender, it's
 *			entry in the list is highlighted.  Servers
 *			can only be removed from the list once 
 *			they are no longer top offenders.
 *
 *			If the NNTP server does not hold any of the
 *			listed groups, a page is presented that says
 *			it is clean, followed by the top 10 list of
 *			offending NNTP servers.
 * 
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <unistd.h>

/* Don't scan pedophilia groups */
#define SCRUB_CP 0

void usage(char *);
int validinput(char *);
int recvline(int, char *, size_t, int, int *);

char *host = NULL;
char *username = NULL;
char *password = NULL;

#define MAXGROUPS  128
struct grouplist {
  const char *list;
  unsigned int scruball:1;
  struct {
    const char *group;
    unsigned int scrub:1;
  } groups[MAXGROUPS];
} grouplist[] = {
#include "bestiality.inc"
#include "movie.inc"
#include "music.inc"
#include "pedophily.inc"
#include "warez.inc"
  {NULL, 0, 
    {
      {NULL, 0},
    },
  },
};

void usage(char *msg)
{
  int i;

  if (msg)
    fprintf(stderr, "Error: %s\n\n", msg);

  fprintf(stderr, "Usage:\n");
  fprintf(stderr, "  whistleblower <ip> [-u <username> [-p <password>]]\n  [");

  for (i = 0; grouplist[i + 1].list; i++)
  {
    fprintf(stderr, "--%s] | [", grouplist[i].list);
  }

  fprintf(stderr, "--%s ]\n", grouplist[i].list);

  exit(1);
}

int validinput(char *str)
{
  int i, len;
  char *p;

  for (i = 0, len = strlen(str); i < len; i++)
    if ((p = strchr("*?&~\\\"\'!#+,()", str[i])))
      return *p;

  return 0;
}

int recvline(int sock, char *buf, size_t len, int flags, int *status)
{
  int n;

  while ((n = recv(sock, buf, len, flags)) < 0)
    buf[n] = '\0';

  *status = strtol(buf, NULL, 10);

  return n;
}

int main(int argc, char **argv)
{
  struct addrinfo hints, *res, *ressave;
  char buffer[512];
  unsigned int numarticles;
  int sock = -1;
  int status;
  int i, j, err;

  if (argc < 2)
    usage("Not enough arguments.");

  host = strdup(argv[1]);

  if (validinput(host))
  {
    fprintf(stderr, "Host contains illegal character `%c'.\n",
            validinput(host));
    exit(1);
  }

  for (i = 2; i < argc; i++)
  {
    if (!strcmp(argv[i], "-u") && (argc - i > 1))
    {
      username = strdup(argv[++i]);

      if (validinput(username))
      {
        fprintf(stderr, "Username contains illegal character `%c'.\n",
                validinput(username));
        exit(1);
      }
    }

    else if (!strcmp(argv[i], "-p") && (argc - i > 1))
    {
      if (!username)
        usage("Use of -p option requires -u option.");

      password = strdup(argv[++i]);

      if (validinput(password))
      {
        fprintf(stderr, "Password contains illegal character `%c'.\n",
                validinput(password));
        exit(1);
      }
    }

    for (j = 0; grouplist[j].list; j++)
    {
      char buf[64];

      snprintf(buf, 64, "--%s", grouplist[j].list);

      if (!strcmp(argv[i], buf))
        grouplist[j].scruball = 0;
    }
  }

  memset(&hints, 0, sizeof(struct addrinfo));
  hints.ai_family = PF_UNSPEC;
  hints.ai_flags = AI_PASSIVE;
  hints.ai_socktype = SOCK_STREAM;

  fprintf(stderr, "Connecting to host %s\n", host);

  if ((err = getaddrinfo(host, "119", &hints, &ressave)))
  {
    fprintf(stderr, "Error: %s\n", gai_strerror(err));
    exit(1);
  }

  for (res = ressave; res; res = res->ai_next)
  {
    sock = socket(res->ai_family, res->ai_socktype, res->ai_protocol);

    if (sock < 0)
      continue;

    if (connect(sock, res->ai_addr, res->ai_addrlen) < 0)
    {
      close(sock);
      sock = -1;
      continue;
    }

    break;
  }

  if (sock < 0)
  {
    fprintf(stderr, "Error: Could not connect to `%s'\n", host);
    exit(1);
  }

  recvline(sock, buffer, 512, 0, &status);

  fprintf(stderr, "-> %s\n", buffer);

  switch (status)
  {
    case 200:
    case 201:
      fprintf(stderr, "Server ready\n");
    break;

    case 204:
    {
      if (!username)
      {
        fprintf(stderr, "Error: Server requires username validation "
          "and no username was given.\n");
        exit(1);
      }

      snprintf(buffer, 512, "AUTHINFO SIMPLE\r\n");
      send(sock, buffer, 512, 0);
      recvline(sock, buffer, 512, 0, &status);

      if (status == 250)
      {
        snprintf(buffer, 512, "%s %s\r\n", username, password);
        send(sock, buffer, 512, 0);
      }

      else
      {
        snprintf(buffer, 512, "AUTHINFO USER %s\r\n", username);
        send(sock, buffer, 512, 0);

        recvline(sock, buffer, 512, 0, &status);

        if (status == 381 && !password)
        {
          fprintf(stderr, "Server requires password authentication.\n");
          exit(1);
        }

        snprintf(buffer, 512, "AUTHINFO PASS %s\r\n", password);
        send(sock, buffer, 512, 0);
      }

      recvline(sock, buffer, 512, 0, &status);

      if (status == 281)
      {
        fprintf(stderr, "Logged in.");
      }

      else if (status == 502)
      {
        fprintf(stderr, "Login failed.");
        exit(1);
      }
    }
    break;

    default:
    {
      fprintf(stderr, "Connection failed.\n");
      exit(1);
    }
  }

  fprintf(stderr, "\n");

  for (i = 0; grouplist[i].list; i++)
  {
    if (grouplist[i].scruball)
      continue;

    fprintf(stderr, "%s:\n", grouplist[i].list);

    if (grouplist[i].scruball)
    {
      fprintf(stderr, "  <not scanned>\n");
      continue;
    }

    for (j = 0; grouplist[i].groups[j].group; j++)
    {
      if (grouplist[i].groups[j].scrub)
      {
        fprintf(stderr, "  <scrubbed>\n");
        continue;
      }

      memset(buffer, 0, 512);
      snprintf(buffer, 510, "GROUP %s", grouplist[i].groups[j].group);
      send(sock, buffer, 510, 0);
      send(sock, "\r\n", 2, 0);
      recvline(sock, buffer, 512, 0, &status);

      /* group does not exist */
      if (status == 411)
      {
        /* fprintf(stderr, "Group %s doesn't exist on server.\n",
                grouplist[i].groups[j].group); */
        continue;
      }

      if ((numarticles = strtol(buffer + 4, NULL, 10)) > 3)
        fprintf(stderr, "  %s HAS BEEN FOUND\n", grouplist[i].groups[j].group);
    }

    fprintf(stderr, "\n");
  }

  close(sock);
  freeaddrinfo(ressave);

  return 0;
}

